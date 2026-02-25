const name = 'Admin User';
const email = `admin${Date.now()}@test.com`;
const password = 'securepassword123';
const role = 'admin';

async function testRegister() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();
        console.log('Registration Response:', data);

        if (response.ok && data.success) {
            console.log('Test Passed: User created successfully!');
        } else {
            console.error('Test Failed.');
        }
    } catch (error) {
        console.error('Error during fetch:', error);
    }
}

testRegister();
