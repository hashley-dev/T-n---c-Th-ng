# =============================================================================
#  Bật GitHub Pages cho repo này bằng GitHub API.
#
#  CÁCH DÙNG (chạy trong PowerShell tại thư mục gốc dự án):
#
#    1. Tạo Personal Access Token tại: https://github.com/settings/tokens
#       - Chọn "Fine-grained token"  -> Repository access: chỉ repo
#         "hashley-dev/T-n---c-Th-ng" -> Permissions -> Repository permissions
#         -> "Pages": Read and write  (và "Contents": Read-only)
#       HOẶC chọn "Tokens (classic)" -> tick scope "repo".
#
#    2. Chạy:
#         .\scripts\enable-pages.ps1
#
#       Script sẽ hỏi token (dạng mật khẩu, không hiện ra màn hình).
#       Token KHÔNG được ghi xuống đĩa — chỉ nằm trong bộ nhớ của tiến trình.
#
#  Sau khi bật xong, vào tab Actions của repo để xem workflow
#  "Deploy static site to GitHub Pages" chạy.
# =============================================================================

[CmdletBinding()]
param(
  [string]$Repo = "hashley-dev/T-n---c-Th-ng",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host "==> Kiem tra Pages hien tai cua $Repo ..." -ForegroundColor Cyan
try {
  $current = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/pages" -Headers @{
    "Accept" = "application/vnd.github+json"
  }
  Write-Host "    Pages DA duoc bat truoc do." -ForegroundColor Yellow
  Write-Host "    URL: $($current.html_url)"
  Write-Host "    build_type: $($current.build_type)"
  if ($current.build_type -ne "workflow") {
    Write-Host "    CANH BAO: build_type dang la '$($current.build_type)', can doi sang 'workflow' de workflow tu dong chay." -ForegroundColor Red
  }
  exit 0
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 404) {
    Write-Host "    Pages CHUA duoc bat. Se bat ngay bay gio." -ForegroundColor Yellow
  } else {
    Write-Host "    Loi khi kiem tra (HTTP $code). Van thu bat tiep." -ForegroundColor Yellow
  }
}

# --- Lay token -----------------------------------------------------------
$secure = Read-Host "Dan Personal Access Token (vd: ghp_... hoac github_pat_...)" -AsSecureString
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
)
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Error "Chua nhap token. Dung."
  exit 1
}

$headers = @{
  "Accept"               = "application/vnd.github+json"
  "Authorization"        = "Bearer $token"
  "X-GitHub-Api-Version" = "2022-11-28"
}

# build_type = "workflow": site duoc build boi .github/workflows/deploy-pages.yml
# (legacy se bo qua workflow va chi lay file tinh tu mot nhanh)
$body = @{
  build_type = "workflow"
} | ConvertTo-Json

Write-Host "==> Dang bat Pages voi build_type = workflow ..." -ForegroundColor Cyan
try {
  $result = Invoke-RestMethod -Method Post `
    -Uri "https://api.github.com/repos/$Repo/pages" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
  Write-Host "    THANH CONG!" -ForegroundColor Green
  Write-Host "    URL: $($result.html_url)"
  Write-Host "    build_type: $($result.build_type)"
  Write-Host ""
  Write-Host "    Buoc cuoi (chi lam mot lan):" -ForegroundColor Cyan
  Write-Host "    Vao https://github.com/$Repo/settings/pages"
  Write-Host "    -> Build and deployment -> Source -> chon 'GitHub Actions'"
  Write-Host "    -> sau do vao tab Actions de xem workflow chay."
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "    THAT BAI (HTTP $code)." -ForegroundColor Red
  try {
    $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd() -ForegroundColor Red
  } catch { }
  Write-Host ""
  Write-Host "Goi y:" -ForegroundColor Yellow
  Write-Host "  - 401/403: token thieu quyen 'Pages: Read and write'."
  Write-Host "  - 404: ten repo sai, hoac token khong co quyen truy cap repo nay."
  exit 1
} finally {
  # Xoa token khoi bo nho
  $token = $null
  Remove-Variable token -ErrorAction SilentlyContinue
}