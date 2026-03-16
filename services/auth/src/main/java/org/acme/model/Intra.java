package org.acme.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "intra", schema = "auth_service")
public class Intra {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	public User user;

	public String kind;
	public String url;
	public String phone;
	public String location;
	public int wallet;

	@Column(name = "correction_points") public int correctionPoints;
	@Column(name = "pool_month") public String poolMonth;
	@Column(name = "pool_year") public String poolYear;
	@Column(name = "is_staff") public boolean isStaff;
	@Column(name = "is_alumni") public boolean isAlumni;
	@Column(name = "is_active") public boolean isActive;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public IntraImage image;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "intra_groups", columnDefinition = "jsonb")
	public List<Map<String, Object>> groups;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> cursus;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> projects;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> achievements;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> titles;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "titles_users", columnDefinition = "jsonb")
	public List<Map<String, Object>> titlesUsers;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> partnerships;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> patroned;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> patroning;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> roles;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> campus;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "campus_users", columnDefinition = "jsonb")
	public List<Map<String, Object>> campusUsers;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> languages;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	public List<Map<String, Object>> expertises;

	@UpdateTimestamp
    @Column(name = "updated_at")
    public Instant updatedAt;
}
