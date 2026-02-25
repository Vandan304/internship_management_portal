async function testAdminInterns() {
    const adminEmail = `adminmanage${Date.now()}@test.com`;

    try {
        // 1. Create and Login Admin
        console.log('1. Setting up Admin Account...');
        await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Admin Manager', email: adminEmail, password: 'password123', role: 'admin' })
        });

        const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: 'password123' })
        });
        const adminToken = (await adminLoginRes.json()).token;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        };

        // 2. CREATE (POST) Intern
        console.log('\n--- Testing CREATE Intern ---');
        let createRes = await fetch('http://localhost:5000/api/admin/intern', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'New Intern', email: `newintern${Date.now()}@test.com`, password: 'password123' })
        });
        let internData = await createRes.json();
        let internId = internData.data._id;
        console.log('CREATE Response:', internData.success ? '✅ Success' : '❌ Failed', internId);

        // 3. READ (GET) Interns
        console.log('\n--- Testing GET Interns ---');
        let getRes = await fetch('http://localhost:5000/api/admin/interns', { method: 'GET', headers });
        let getData = await getRes.json();
        console.log('GET Response:', getData.success ? `✅ Success (Count: ${getData.count})` : '❌ Failed');

        // 4. UPDATE (PUT) Intern
        console.log('\n--- Testing UPDATE Intern ---');
        let putRes = await fetch(`http://localhost:5000/api/admin/intern/${internId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ name: 'Updated Intern Name' })
        });
        let putData = await putRes.json();
        console.log('UPDATE Response:', putData.success && putData.data.name === 'Updated Intern Name' ? '✅ Success' : '❌ Failed');

        // 5. BLOCK (PATCH) Intern
        console.log('\n--- Testing BLOCK Intern ---');
        let blockRes = await fetch(`http://localhost:5000/api/admin/intern/${internId}/block`, { method: 'PATCH', headers });
        let blockData = await blockRes.json();
        console.log('BLOCK Response:', blockData.success && blockData.data.loginAllowed === false ? '✅ Success' : '❌ Failed');

        // 6. ACTIVATE (PATCH) Intern
        console.log('\n--- Testing ACTIVATE Intern ---');
        let actRes = await fetch(`http://localhost:5000/api/admin/intern/${internId}/activate`, { method: 'PATCH', headers });
        let actData = await actRes.json();
        console.log('ACTIVATE Response:', actData.success && actData.data.loginAllowed === true ? '✅ Success' : '❌ Failed');

        // 7. DELETE Intern
        console.log('\n--- Testing DELETE Intern ---');
        let delRes = await fetch(`http://localhost:5000/api/admin/intern/${internId}`, { method: 'DELETE', headers });
        let delData = await delRes.json();
        console.log('DELETE Response:', delData.success ? '✅ Success' : '❌ Failed');

    } catch (error) {
        console.error('Error during testing:', error);
    }
}

testAdminInterns();
