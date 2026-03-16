package org.acme.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class IntraDTO {
	public Long id;
	public String email;
	public String login;
	@JsonProperty("first_name") public String firstName;
	@JsonProperty("last_name") public String lastName;
	@JsonProperty("usual_full_name") public String usualFullName;
	@JsonProperty("usual_first_name") public String usualFirstName;
	public String url;
	public String phone;
	@JsonProperty("displayname") public String displayName;
	public String kind;
	public ImageDTO image;
	@JsonProperty("staff?") public boolean isStaff;
	@JsonProperty("correction_point") public int correctionPoints;
	@JsonProperty("pool_month") public String poolMonth;
	@JsonProperty("pool_year") public String poolYear;
	public String location;
	public int wallet;
	@JsonProperty("anonymize_date") public String anonymizeDate;
	@JsonProperty("data_erasure_date") public String dataErasureDate;
	@JsonProperty("alumni?") public boolean isAlumni;
	@JsonProperty("active?") public boolean isActive;
	
	public List<Map<String, Object>> groups;
	@JsonProperty("cursus_users") public List<Map<String, Object>> cursusUsers;
	@JsonProperty("projects_users") public List<Map<String, Object>> projectsUsers;
	@JsonProperty("languages_users") public List<Map<String, Object>> languagesUsers;
	public List<Map<String, Object>> achievements;
	public List<Map<String, Object>> titles;
	@JsonProperty("titles_users") public List<Map<String, Object>> titlesUsers;
	public List<Map<String, Object>> partnerships;
	public List<Map<String, Object>> patroned;
	public List<Map<String, Object>> patroning;
	@JsonProperty("expertises_users") public List<Map<String, Object>> expertisesUsers;
	public List<Map<String, Object>> roles;
	public List<Map<String, Object>> campus;
	@JsonProperty("campus_users") public List<Map<String, Object>> campusUsers;

	public static class ImageDTO {
		public String link;
		public Map<String, String> versions;
	}
}
