import { apiRequest } from './request'

export function getSchedulableWebhookInfo() {
  return apiRequest('/schedulable-mail/webhook-info')
}

export function listSchedulableEmails() {
  return apiRequest('/schedulable-mail')
}

export function scheduleTodoFromEmail(emailId, payload) {
  return apiRequest(`/schedulable-mail/${encodeURIComponent(emailId)}/schedule-todo`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function scheduleEveFromEmail(emailId, payload) {
  return apiRequest(`/schedulable-mail/${encodeURIComponent(emailId)}/schedule-eve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSchedulableEmail(emailId, changes) {
  return apiRequest(`/schedulable-mail/${encodeURIComponent(emailId)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export function deleteSchedulableEmail(emailId) {
  return apiRequest(`/schedulable-mail/${encodeURIComponent(emailId)}`, {
    method: 'DELETE',
  })
}
