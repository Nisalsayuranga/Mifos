$supabaseUrl = "https://ielkaetihagxgnrrasch.supabase.co"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg"

$authHeaders = @{
    "apikey" = $serviceRoleKey
    "Authorization" = "Bearer $serviceRoleKey"
}

$dbHeaders = @{
    "apikey" = $serviceRoleKey
    "Authorization" = "Bearer $serviceRoleKey"
    "Prefer" = "resolution=merge-duplicates"
}

# 1. Seed Branches first to satisfy foreign key constraints
$branchesToSeed = @(
    [PSCustomObject]@{ id = "BRL"; name = "Borella" },
    [PSCustomObject]@{ id = "DHW"; name = "Dehiwala" },
    [PSCustomObject]@{ id = "DMT"; name = "Dematagoda" },
    [PSCustomObject]@{ id = "HMG"; name = "Homagama" },
    [PSCustomObject]@{ id = "KDW"; name = "Kadawatha" },
    [PSCustomObject]@{ id = "KIR"; name = "Kiribathgoda" },
    [PSCustomObject]@{ id = "KOT"; name = "Kotikawatta" },
    [PSCustomObject]@{ id = "KTW"; name = "Kottawa" },
    [PSCustomObject]@{ id = "PND"; name = "Panadura" },
    [PSCustomObject]@{ id = "HQ";  name = "Head Office" }
)

Write-Host "Seeding branches..."
foreach ($branch in $branchesToSeed) {
    $branchBody = @{
        id = $branch.id
        name = $branch.name
        created_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
        is_active = $true
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/branches" -Headers $dbHeaders -Method Post -Body $branchBody -ContentType "application/json"
        Write-Host "Branch $($branch.name) seeded."
    } catch {
        Write-Error "Failed to seed branch $($branch.name): $_"
    }
}

$branchData = @(
    [PSCustomObject]@{ name = "Borella";      id = "BRL"; email = "branch.brl@rupasinghe.com"; password = "Borella123" },
    [PSCustomObject]@{ name = "Kotikawatta";  id = "KOT"; email = "branch.kot@rupasinghe.com"; password = "Kotikawatta123" },
    [PSCustomObject]@{ name = "Dematagoda";   id = "DMT"; email = "branch.dmt@rupasinghe.com"; password = "Dematagoda123" },
    [PSCustomObject]@{ name = "Wattala 2";    id = "W2";  email = "branch.w2@rupasinghe.com";  password = "Wattala2123" },
    [PSCustomObject]@{ name = "Wattala 3";    id = "W3";  email = "branch.w3@rupasinghe.com";  password = "Wattala3123" },
    [PSCustomObject]@{ name = "Wattala 4";    id = "W4";  email = "branch.w4@rupasinghe.com";  password = "Wattala4123" },
    [PSCustomObject]@{ name = "Kiribathgoda"; id = "KIR"; email = "branch.kir@rupasinghe.com"; password = "Kiribathgoda123" },
    [PSCustomObject]@{ name = "Kadawatha";    id = "KDW"; email = "branch.kdw@rupasinghe.com"; password = "Kadawatha123" },
    [PSCustomObject]@{ name = "Dehiwala";     id = "DHW"; email = "branch.dhw@rupasinghe.com"; password = "Dehiwala123" },
    [PSCustomObject]@{ name = "Panadura";     id = "PND"; email = "branch.pnd@rupasinghe.com"; password = "Panadura123" },
    [PSCustomObject]@{ name = "Kottawa";      id = "KTW"; email = "branch.ktw@rupasinghe.com"; password = "Kottawa123" },
    [PSCustomObject]@{ name = "Homagama";     id = "HMG"; email = "branch.hmg@rupasinghe.com"; password = "Homagama123" }
)

Write-Host "Fetching existing users from Supabase Auth..."
$usersUrl = "$supabaseUrl/auth/v1/admin/users"
try {
    $response = Invoke-RestMethod -Uri $usersUrl -Headers $authHeaders -Method Get
    $authUsers = $response.users
    Write-Host "Found $($authUsers.Count) users."
} catch {
    Write-Error "Failed to fetch users: $_"
    exit 1
}

# 1. Seed Admin User
$adminEmail = "admin@rupasinghe.com"
$adminPassword = "HeadOffice@2024"
$adminUser = $authUsers | Where-Object { $_.email -eq $adminEmail }
$adminId = $null

if ($null -eq $adminUser) {
    Write-Host "Creating admin user..."
    $body = @{
        email = $adminEmail
        password = $adminPassword
        email_confirm = $true
    } | ConvertTo-Json
    
    try {
        $newAdmin = Invoke-RestMethod -Uri $usersUrl -Headers $authHeaders -Method Post -Body $body -ContentType "application/json"
        $adminId = $newAdmin.id
        Write-Host "Admin user created successfully with ID: $adminId"
    } catch {
        Write-Error "Failed to create admin user: $_"
    }
} else {
    $adminId = $adminUser.id
    Write-Host "Admin user already exists with ID: $adminId. Updating password..."
    $body = @{
        password = $adminPassword
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$usersUrl/$adminId" -Headers $authHeaders -Method Put -Body $body -ContentType "application/json"
        Write-Host "Admin password updated successfully."
    } catch {
        Write-Error "Failed to update admin password: $_"
    }
}

# Upsert Admin Profile
if ($null -ne $adminId) {
    Write-Host "Upserting admin profile..."
    $profileBody = @{
        id = $adminId
        email = $adminEmail
        branch_id = "HQ"
        branch_name = "Head Office"
        role = "ADMIN"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/profiles" -Headers $dbHeaders -Method Post -Body $profileBody -ContentType "application/json"
        Write-Host "Admin profile upserted."
    } catch {
        Write-Error "Failed to upsert admin profile: $_"
    }
}

# 2. Seed Branch Users
foreach ($branch in $branchData) {
    $existingUser = $authUsers | Where-Object { $_.email -eq $branch.email }
    $userId = $null
    
    if ($null -eq $existingUser) {
        Write-Host "Creating user for $($branch.name) ($($branch.email))..."
        $body = @{
            email = $branch.email
            password = $branch.password
            email_confirm = $true
        } | ConvertTo-Json
        
        try {
            $newUser = Invoke-RestMethod -Uri $usersUrl -Headers $authHeaders -Method Post -Body $body -ContentType "application/json"
            $userId = $newUser.id
            Write-Host "User created successfully with ID: $userId"
        } catch {
            Write-Error "Failed to create user for $($branch.name): $_"
            continue;
        }
    } else {
        $userId = $existingUser.id
        Write-Host "User already exists for $($branch.name) ($($branch.email)) with ID: $userId. Updating password..."
        $body = @{
            password = $branch.password
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri "$usersUrl/$userId" -Headers $authHeaders -Method Put -Body $body -ContentType "application/json"
            Write-Host "Password updated successfully."
        } catch {
            Write-Error "Failed to update password for $($branch.name): $_"
        }
    }
    
    # Upsert Branch Profile
    if ($null -ne $userId) {
        Write-Host "Upserting profile for $($branch.name)..."
        $profileBody = @{
            id = $userId
            email = $branch.email
            branch_id = $branch.id
            branch_name = $branch.name
            role = "TELLER"
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/profiles" -Headers $dbHeaders -Method Post -Body $profileBody -ContentType "application/json"
            Write-Host "Profile upserted."
        } catch {
            Write-Error "Failed to upsert profile for $($branch.name): $_"
        }
        
        # Upsert Branch Status
        Write-Host "Setting initial branch status to CLOSED for $($branch.name)..."
        $statusBody = @{
            branch_id = $branch.id
            status = "CLOSED"
            updated_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/branch_status" -Headers $dbHeaders -Method Post -Body $statusBody -ContentType "application/json"
            Write-Host "Branch status upserted."
        } catch {
            Write-Error "Failed to upsert branch status for $($branch.name): $_"
        }
    }
}

Write-Host "Direct Database Seeding Complete!"
