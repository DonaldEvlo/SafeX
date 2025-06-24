class User {
  constructor({ uid, email, name, username, role = 'user', profileUrl, createdAt = null }) {
    this.uid = uid
    this.email = email
    this.name = name
    this.username = username
    this.role = role
    this.profileUrl = profileUrl
    this.createdAt = createdAt
  }

  static fromJson(json) {
    if (!json) return null
    return new User({
      uid: json.uid,
      email: json.email,
      name: json.name,
      username: json.username,
      role: json.role,
      profileUrl: json.profileUrl,
      createdAt: json.createdAt
    })
  }

  toJson() {
    return {
      uid: this.uid,
      email: this.email,
      name: this.name,
      username: this.username,
      role: this.role,
      profileUrl: this.profileUrl,
      createdAt: this.createdAt
    }
  }
}

module.exports = User
