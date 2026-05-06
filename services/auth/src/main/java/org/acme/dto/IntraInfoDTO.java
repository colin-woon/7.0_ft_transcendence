package org.acme.dto;

import java.util.List;
import java.util.Map;

import org.acme.model.Intra;

public class IntraInfoDTO {
	public String phone;
	public int correctionPoints;
	public String poolMonth;
	public String poolYear;
	public String location;
	public int wallet;
	public boolean isAlumni;
	public boolean isActive;
	public int groupsCount;
	public int partnershipsCount;

	public List<Map<String, Object>> cursusUsers;
	public List<Map<String, Object>> projectsUsers;
	public List<Map<String, Object>> languagesUsers;
	public List<Map<String, Object>> achievements;
	public List<Map<String, Object>> titlesUsers;
	public List<Map<String, Object>> expertisesUsers;
	public List<Map<String, Object>> campusUsers;

	public IntraInfoDTO() {}

	public IntraInfoDTO(Intra intra) {
		this.phone = intra.phone;
		this.correctionPoints = intra.correctionPoints;
		this.poolMonth = intra.poolMonth;
		this.poolYear = intra.poolYear;
		this.location = intra.location;
		this.wallet = intra.wallet;
		this.isAlumni = intra.isAlumni;
		this.isActive = intra.isActive;
		this.groupsCount = intra.groupsCount;
		this.partnershipsCount = intra.partnershipsCount;
		this.cursusUsers = intra.cursus;
		this.projectsUsers = intra.projects;
		this.languagesUsers = intra.languages;
		this.achievements = intra.achievements;
		this.titlesUsers = intra.titlesUsers;
		this.expertisesUsers = intra.expertises;
		this.campusUsers = intra.campusUsers;
	}
}
