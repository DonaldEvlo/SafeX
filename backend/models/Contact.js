class Contact {
  constructor({
    id, // UID du contact
    name,
    email,
    profileUrl = '',
    lastInteractedAt = null,
    isBlocked = false,
    isFavorite = false
  }) {
    this.id = id
    this.name = name
    this.email = email
    this.profileUrl = profileUrl
    this.lastInteractedAt = lastInteractedAt
    this.isBlocked = isBlocked
    this.isFavorite = isFavorite
  }

  static fromJson(json) {
    if (!json) return null
    return new Contact({
      id: json.id,
      name: json.name,
      email: json.email,
      profileUrl: json.profileUrl,
      lastInteractedAt: json.lastInteractedAt,
      isBlocked: json.isBlocked ?? false,
      isFavorite: json.isFavorite ?? false
    })
  }

  toJson() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      profileUrl: this.profileUrl,
      lastInteractedAt: this.lastInteractedAt,
      isBlocked: this.isBlocked,
      isFavorite: this.isFavorite
    }
  }
}

module.exports = Contact
