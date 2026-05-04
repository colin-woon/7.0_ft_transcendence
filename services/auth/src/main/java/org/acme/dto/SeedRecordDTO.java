package org.acme.dto;

import java.util.List;
import java.util.Map;

public class SeedRecordDTO {

	public SeedUserData user;
	public SeedIntraData intra;

	public static class SeedUserData {
		public String email;
		public String intraId;
		public String username;
		public String fullName;
		public String bio;
		public String role;
		public boolean isBanned;
	}

	public static class SeedIntraData {
		public String intraId;
		public String phone;
		public String imageUrl;
		public int correctionPoints;
		public String poolMonth;
		public String poolYear;
		public String location;
		public int wallet;
		public boolean isStaff;
		public boolean isAlumni;
		public boolean isActive;
		public int groupsCount;
		public int partnershipsCount;

		public List<Map<String, Object>> cursusUsers;
		public List<Map<String, Object>> projectsUsers;
		public List<Map<String, Object>> achievements;
		public List<Map<String, Object>> titlesUsers;
		public List<Map<String, Object>> languagesUsers;
		public List<Map<String, Object>> expertisesUsers;
		public List<Map<String, Object>> campusUsers;
	}
}
