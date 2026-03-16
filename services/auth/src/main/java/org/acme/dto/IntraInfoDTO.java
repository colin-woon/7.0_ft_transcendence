package org.acme.dto;

import java.util.List;
import java.util.Map;

import org.acme.model.Intra;
import org.acme.model.IntraImage;

public class IntraInfoDTO {
	public String url;
	public String phone;
	public String kind;
	public IntraImage image;
	public int correctionPoints;
	public String poolMonth;
	public String poolYear;
	public String location;
	public int wallet;
	public boolean isAlumni;
	public boolean isActive;

	public List<Map<String, Object>> groups;
	public List<Map<String, Object>> cursusUsers;
	public List<Map<String, Object>> projectsUsers;
	public List<Map<String, Object>> languagesUsers;
	public List<Map<String, Object>> achievements;
	public List<Map<String, Object>> titles;
	public List<Map<String, Object>> titlesUsers;
	public List<Map<String, Object>> partnerships;
	public List<Map<String, Object>> patroned;
	public List<Map<String, Object>> patroning;
	public List<Map<String, Object>> expertisesUsers;
	public List<Map<String, Object>> roles;
	public List<Map<String, Object>> campus;
	public List<Map<String, Object>> campusUsers;

	public IntraInfoDTO() {}

	public IntraInfoDTO(Intra intra) {
		this.url = intra.url;
		this.phone = intra.phone;
		this.kind = intra.kind;
		this.image = intra.image;
		this.correctionPoints = intra.correctionPoints;
		this.poolMonth = intra.poolMonth;
		this.poolYear = intra.poolYear;
		this.location = intra.location;
		this.wallet = intra.wallet;
		this.isAlumni = intra.isAlumni;
		this.isActive = intra.isActive;
		this.groups = intra.groups;
		this.cursusUsers = intra.cursus;
		this.projectsUsers = intra.projects;
		this.languagesUsers = intra.languages;
		this.achievements = intra.achievements;
		this.titles = intra.titles;
		this.titlesUsers = intra.titlesUsers;
		this.partnerships = intra.partnerships;
		this.patroned = intra.patroned;
		this.patroning = intra.patroning;
		this.expertisesUsers = intra.expertises;
		this.roles = intra.roles;
		this.campus = intra.campus;
		this.campusUsers = intra.campusUsers;
	}
}
