import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_PASSWORD = "Jenius@2026";
const ACCOUNT_EMAIL_DOMAIN = "accounts.jenius.local";
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,30}$/;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function createAccount(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const role = readString(payload.role);
  const { data: roleRow, error: roleError } = await admin.from("roles").select("key").eq("key", role).maybeSingle();
  if (roleError) throw roleError;
  if (!roleRow) {
    return jsonResponse({ error: "Vai trò không hợp lệ." }, 400);
  }

  const employeeSystemUid = readString(payload.employee_system_uid);
  let username = readString(payload.username);
  let fullName = readString(payload.full_name);
  let existingAuthUserId: string | null = null;

  if (employeeSystemUid) {
    const { data: employee, error } = await admin
      .from("employees")
      .select("code, full_name, auth_user_id")
      .eq("system_uid", employeeSystemUid)
      .maybeSingle();
    if (error) throw error;
    if (!employee) {
      return jsonResponse({ error: "Không tìm thấy hồ sơ nhân viên." }, 404);
    }
    username = employee.code;
    fullName = employee.full_name;
    existingAuthUserId = employee.auth_user_id ?? null;

    const { data: linked, error: linkedError } = await admin
      .from("app_users")
      .select("id")
      .eq("employee_system_uid", employeeSystemUid)
      .maybeSingle();
    if (linkedError) throw linkedError;
    if (linked) {
      return jsonResponse({ error: "Hồ sơ nhân viên này đã được liên kết với tài khoản khác." }, 409);
    }
  }

  if (!USERNAME_PATTERN.test(username)) {
    return jsonResponse({ error: "Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang (3-30 ký tự)." }, 400);
  }
  if (!fullName) {
    return jsonResponse({ error: "Vui lòng nhập họ và tên." }, 400);
  }

  const { data: taken, error: takenError } = await admin
    .from("app_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (takenError) throw takenError;
  if (taken) {
    return jsonResponse({ error: "Tên đăng nhập này đã tồn tại." }, 409);
  }

  let authUserId = existingAuthUserId;
  let createdAuthUserId: string | null = null;
  if (!authUserId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: `${username.toLowerCase()}@${ACCOUNT_EMAIL_DOMAIN}`,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { username },
    });
    if (createError || !created.user) {
      console.error("createUser failed", createError);
      return jsonResponse({ error: "Không thể tạo tài khoản đăng nhập cho tên này." }, 409);
    }
    authUserId = created.user.id;
    createdAuthUserId = created.user.id;
  }

  const { data: inserted, error: insertError } = await admin
    .from("app_users")
    .insert({
      username,
      full_name: fullName,
      role,
      employee_system_uid: employeeSystemUid || null,
      auth_user_id: authUserId,
    })
    .select("system_uid")
    .single();

  if (insertError || !inserted) {
    console.error("app_users insert failed", insertError);
    if (createdAuthUserId) {
      await admin.auth.admin.deleteUser(createdAuthUserId);
    }
    return jsonResponse({ error: "Không thể lưu tài khoản. Vui lòng thử lại." }, 409);
  }

  return jsonResponse({ ok: true, system_uid: inserted.system_uid }, 200);
}

async function resetPassword(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const systemUid = readString(payload.system_uid);
  if (!systemUid) {
    return jsonResponse({ error: "Thiếu mã tài khoản." }, 400);
  }

  const { data: account, error } = await admin
    .from("app_users")
    .select("auth_user_id")
    .eq("system_uid", systemUid)
    .maybeSingle();
  if (error) throw error;
  if (!account) {
    return jsonResponse({ error: "Không tìm thấy tài khoản." }, 404);
  }
  if (!account.auth_user_id) {
    return jsonResponse({ error: "Tài khoản này chưa có mật khẩu đăng nhập." }, 409);
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(account.auth_user_id, {
    password: DEFAULT_PASSWORD,
  });
  if (updateError) {
    console.error("updateUserById failed", updateError);
    return jsonResponse({ error: "Không thể đặt lại mật khẩu. Vui lòng thử lại." }, 500);
  }

  return jsonResponse({ ok: true }, 200);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const action = readString(payload?.action);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (action === "create") return await createAccount(admin, payload);
    if (action === "reset_password") return await resetPassword(admin, payload);
    return jsonResponse({ error: "Yêu cầu không hợp lệ." }, 400);
  } catch (err) {
    console.error("manage-user-accounts failed", err);
    return jsonResponse({ error: "Đã xảy ra lỗi. Vui lòng thử lại." }, 500);
  }
});
