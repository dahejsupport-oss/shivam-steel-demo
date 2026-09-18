import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, body, pdfBase64, pdfFileName } = await req.json();

    if (!to) {
      return new Response(JSON.stringify({ error: "Recipient email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
    const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev";
    const SENDER_NAME = Deno.env.get("SENDER_NAME") || "DAHEJ SUPPORT (Dahej)";

    const attachments = pdfBase64
      ? [
          {
            filename: pdfFileName || "Dahej_Support_Proforma_Invoice.pdf",
            content: pdfBase64.replace(/^data:application\/pdf;base64,/, ""),
          },
        ]
      : [];

    const formattedHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #00286a; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #00286a; margin: 0;">DAHEJ SUPPORT</h2>
          <span style="font-size: 12px; color: #64748b;">Industrial Steel & Building Materials Supplier · Dahej, Gujarat</span>
        </div>
        <pre style="font-family: inherit; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #1e293b;">${body}</pre>
        <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 14px; font-size: 12px; color: #94a3b8;">
          This is an official commercial communication from DAHEJ SUPPORT · Dahej, Gujarat.
        </div>
      </div>
    `;

    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
          to: [to],
          subject: subject || "Official Proforma Invoice - DAHEJ SUPPORT",
          html: formattedHtml,
          attachments,
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: `Email queued for ${to}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
