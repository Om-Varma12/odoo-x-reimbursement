import axiosInstance from "../utils/axiosInstance";

const API_URL = "/api/auth";

const unwrapData = (response) => {
	if (response?.data?.data !== undefined) {
		return response.data.data;
	}

	return response?.data;
};

export const authService = {
	signup: async ({ email, password, companyName, country, currencyCode, role }) => {
		const response = await axiosInstance.post(`${API_URL}/signup`, {
			email,
			password,
			companyName,
			country,
			currencyCode,
			role,
		});

		return unwrapData(response);
	},

	login: async (email, password) => {
		const response = await axiosInstance.post(`${API_URL}/login`, {
			email,
			password,
		});

		return unwrapData(response);
	},

	logout: async () => {
		// No backend logout endpoint yet; keep for API consistency.
		return Promise.resolve();
	},

	verifyToken: async () => {
		const response = await axiosInstance.get("/api/health");
		return unwrapData(response);
	},
};

