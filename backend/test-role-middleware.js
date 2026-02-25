async function testRoleMiddleware() {
    const adminEmail = `adminrole${Date.now()}@test.com`;
    const internEmail = `internrole${Date.now()}@test.com`;

    try {
        // 1. Register Admin
        console.log('1. Registering Admin user...');
        await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Admin Test', email: adminEmail, password: 'password123', role: 'admin' })
        });

        // 2. Register Intern
        console.log('2. Registering Intern user...');
        await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Intern Test', email: internEmail, password: 'password123', role: 'intern' })
        });

        // 3. Login Admin
        console.log('3. Logging in Admin...');
        const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: 'password123' })
        });
        const adminData = await adminLoginRes.json();
        const adminToken = adminData.token;

        // 4. Login Intern
        console.log('4. Logging in Intern...');
        const internLoginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: internEmail, password: 'password123' })
        });
        const internData = await internLoginRes.json();
        const internToken = internData.token;

        // 5. Test Admin Accessing Admin Route
        console.log('\n--- Testing Route Access ---');
        console.log('Testing Admin accessing /api/auth/admin-only...');
        const adminAccessRes = await fetch('http://localhost:5000/api/auth/admin-only', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const adminAccessData = await adminAccessRes.json();
        if (adminAccessRes.ok && adminAccessData.success) {
            console.log('✅ SUCCESS: Admin granted access to admin route.');
        } else {
            console.error('❌ FAILED: Admin blocked from admin route.');
        }

        // 6. Test Intern Accessing Admin Route
        console.log('Testing Intern accessing /api/auth/admin-only...');
        const internAccessRes = await fetch('http://localhost:5000/api/auth/admin-only', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${internToken}` }
        });
        if (internAccessRes.status === 403) {
            console.log('✅ SUCCESS: Intern correctly blocked from admin route (403 Forbidden).');
        } else {
            console.error(`❌ FAILED: Intern not correctly blocked. Status: ${internAccessRes.status}`);
        }

    } catch (error) {
        console.error('Error during testing:', error);
    }
}

testRoleMiddleware();
