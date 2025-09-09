export class Task {
  constructor({
    id,
    title,
    details = null,
    completed = false,
    completionReason = null,
    completionSignature = null,
    completedAt = null,
    createdAt = null,
    updatedAt = null
  }) {
    this.id = id;
    this.title = title;
    this.details = details;
    this.completed = completed;
    this.completionReason = completionReason;
    this.completionSignature = completionSignature;
    this.completedAt = completedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
  withChanges(patch) {
    return new Task({ ...this, ...patch });
  }
  static sanitizeInput({ title, details }) {
    return {
      title: title.trim(),
      details: details?.trim() || null
    };
  }
}