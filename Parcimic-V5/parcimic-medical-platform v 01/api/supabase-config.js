// Supabase Configuration
const supabaseConfig = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
    serviceRoleKey: 'your-service-role-key'
};

// Supabase Client (for future use)
class SupabaseClient {
    constructor(config) {
        this.url = config.url;
        this.key = config.anonKey;
    }

    async query(table, method = 'GET', data = null) {
        const headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
        };

        const options = {
            method,
            headers
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.url}/rest/v1/${table}`, options);
            return await response.json();
        } catch (error) {
            console.error('Supabase query error:', error);
            throw error;
        }
    }

    // Health Records Operations
    async getHealthRecords(userId) {
        return this.query(`health_records?user_id=eq.${userId}&select=*`);
    }

    async addHealthRecord(record) {
        return this.query('health_records', 'POST', record);
    }

    async updateHealthRecord(id, updates) {
        return this.query(`health_records?id=eq.${id}`, 'PATCH', updates);
    }

    async deleteHealthRecord(id) {
        return this.query(`health_records?id=eq.${id}`, 'DELETE');
    }

    // Emergency Contacts Operations
    async getEmergencyContacts() {
        return this.query('emergency_contacts?select=*');
    }

    // Hospital Data Operations
    async getHospitals(lat, lng, radius) {
        return this.query(`hospitals?location=within.radius(${lng},${lat},${radius})&select=*`);
    }
}

// Initialize Supabase client
const supabase = new SupabaseClient(supabaseConfig);

// Make globally available
window.supabase = supabase;
window.supabaseConfig = supabaseConfig;