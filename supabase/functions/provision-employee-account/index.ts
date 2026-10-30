import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_PASSWORD = "Jenius@2026";
const ACCOUNT_EMAIL_DOMAIN = "accounts.jenius.local";

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const employeeCode = typeof payload?.employee_code === "string" ? payload.employee_code.trim() : "";
    if (!employeeCode) {
      return jsonResponse({ error: "Thiếu mã nhân viên." }, 400);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: employee, error: fetchError } = await admin
      .from("employees")
      .select("code, has_account")
      .eq("code", employeeCode)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!employee) {
      return jsonResponse({ error: "Không tìm thấy nhân viên." }, 404);
    }
    if (employee.has_account) {
      return jsonResponse({ ok: true, alreadyLinked: true }, 200);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: `${employee.code.toLowerCase()}@${ACCOUNT_EMAIL_DOMAIN}`,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { employee_code: employee.code },
    });
    if (createError || !created.user) {
      console.error("createUser failed", createError);
      return jsonResponse({ error: "Không thể tạo tài khoản cho nhân viên này." }, 409);
    }

    const { error: updateError } = await admin
      .from("employees")
      .update({ has_account: true, auth_user_id: created.user.id })
      .eq("code", employee.code);
    if (updateError) throw updateError;

    return jsonResponse({ ok: true, alreadyLinked: false }, 200);
  } catch (err) {
    console.error("provision-employee-account failed", err);
    return jsonResponse({ error: "Đã xảy ra lỗi khi tạo tài khoản." }, 500);
  }
});
