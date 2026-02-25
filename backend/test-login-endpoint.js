async function testLoginAndRegister() {
    const email = `testlogin${Date.now()}@test.com`;
    const password = 'loginpassword123';

    try {
        console.log('1. Registering user...');
        await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Login Test', email, password, role: 'intern' })
        });

        console.log('2. Attempting to log in...');
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login Response:', data);

        if (response.ok && data.success && data.token) {
            console.log('Test Passed: Valid JWT token received, and redirect is:', data.redirectTo);
        } else {
            console.error('Test Failed.');
        }
    } catch (error) {
        console.error('Error during fetch:', error);
    }
}

testLoginAndRegister();
