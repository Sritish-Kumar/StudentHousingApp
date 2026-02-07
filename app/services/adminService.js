const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Get all users (Admin only)
 */
export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch users");
  }

  return data;
};

/**
 * Get user profile (Admin only)
 */
export const getUserProfile = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${userId}/profile`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user profile");
  }

  return data;
};

/**
 * Update user profile (Admin only)
 * Currently used for verifying landlords
 */
export const updateUserProfile = async (userId, updateData) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${userId}/profile`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      body: JSON.stringify(updateData),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update user profile");
  }

  return data;
};
