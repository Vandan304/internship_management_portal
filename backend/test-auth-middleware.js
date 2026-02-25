async function testAuthMiddleware() {
    const email = `testauth${Date.now()}@test.com`;
    const password = 'authpassword123';
    let token = null;

    try {
        console.log('1. Registering user...');
        await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Auth Middleware Test', email, password, role: 'intern' })
        });

        console.log('2. Attempting to log in to get token...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();
        if (!loginData.success || !loginData.token) {
            throw new Error('Login failed, no token received');
        }
        token = loginData.token;
        console.log('Token received.');

        console.log('3. Accessing protected route (/api/auth/me) WITH token...');
        const protectedResponse = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const protectedData = await protectedResponse.json();
        console.log('Protected Route Response (with token):', protectedData);

        if (protectedResponse.ok && protectedData.success && protectedData.user) {
            console.log('SUCCESS: Protected route correctly verified token and returned user attached to request!');
        } else {
            console.error('FAILED: Protected route test failed to return user data.');
        }

        console.log('4. Accessing protected route (/api/auth/me) WITHOUT token...');
        const unauthorizedResponse = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET'
        });

        if (unauthorizedResponse.status === 401) {
            console.log('SUCCESS: Protected route correctly denied access without a token (401 Unauthorized)!');
        } else {
            console.error(`FAILED: Expected 401 Unauthorized, but got ${unauthorizedResponse.status}`);
        }

    } catch (error) {
        console.error('Error during fetch:', error);
    }
}

testAuthMiddleware();
