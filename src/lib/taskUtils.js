export async function createFinalCheckTasks(caseId) {
  if (!caseId) return
  try {
    await fetch('/api/admin-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createFinalCheckTasks', caseId }),
    })
  } catch {
    // silent — task completion itself already succeeded
  }
}
