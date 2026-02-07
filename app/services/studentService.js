const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Get authenticated student's profile
 */
export const getStudentProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch profile");
  }

  return data;
};

/**
 * Update student profile
 */
export const updateStudentProfile = async (profileData) => {
  const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile");
  }

  return data;
};

/**
 * Get public student profile by ID
 */
export const getPublicStudentProfile = async (studentId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/student/profile/${studentId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch student profile");
  }

  return data;
};
