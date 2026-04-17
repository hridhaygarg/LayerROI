/**
 * API Service Layer
 * Centralized API client for all backend calls
 */
import { authService } from './authService.js';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.layeroi.com';

class APIService {
  constructor() {
    this.baseURL = API_URL;
  }

  /**
   * Make HTTP request with auth headers
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...authService.getAuthHeader(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - unauthorized
      if (response.status === 401) {
        authService.logout();
        throw new Error('Unauthorized - please login again');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ===== Agents API =====
  async getAgents(orgId) {
    return this.request(`/api/agents?orgId=${orgId}`);
  }

  async getAgent(agentId) {
    return this.request(`/api/agents/${agentId}`);
  }

  async createAgent(agentData) {
    return this.request('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  }

  async updateAgent(agentId, agentData) {
    return this.request(`/api/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    });
  }

  async deleteAgent(agentId) {
    return this.request(`/api/agents/${agentId}`, { method: 'DELETE' });
  }

  // ===== Costs & Financial Data =====
  async getCostsSummary(orgId, timeframe = '30d') {
    return this.request(`/api/costs/summary?orgId=${orgId}&timeframe=${timeframe}`);
  }

  async getCostsBreakdown(orgId, groupBy = 'agent') {
    return this.request(`/api/costs/breakdown?orgId=${orgId}&groupBy=${groupBy}`);
  }

  async getROIMetrics(orgId) {
    return this.request(`/api/insights/roi?orgId=${orgId}`);
  }

  // ===== Dashboard Stats =====
  async getDashboardStats(orgId) {
    return this.request(`/api/stats?orgId=${orgId}`);
  }

  async getMetricsTimeseries(orgId, metric, granularity = 'daily') {
    return this.request(`/api/metrics/${metric}?orgId=${orgId}&granularity=${granularity}`);
  }

  // ===== Integrations =====
  async getIntegrations(orgId) {
    return this.request(`/api/integrations?orgId=${orgId}`);
  }

  async createIntegration(orgId, integrationData) {
    return this.request('/api/integrations', {
      method: 'POST',
      body: JSON.stringify({ ...integrationData, orgId }),
    });
  }

  async testIntegration(integrationId) {
    return this.request(`/api/integrations/${integrationId}/test`, {
      method: 'POST',
    });
  }

  async deleteIntegration(integrationId) {
    return this.request(`/api/integrations/${integrationId}`, { method: 'DELETE' });
  }

  // ===== Team & Workspace =====
  async getWorkspaceMembers(orgId) {
    return this.request(`/api/workspace/${orgId}/members`);
  }

  async inviteTeamMember(orgId, email, role = 'member') {
    return this.request(`/api/workspace/${orgId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async updateMemberRole(orgId, userId, role) {
    return this.request(`/api/workspace/${orgId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async removeTeamMember(orgId, userId) {
    return this.request(`/api/workspace/${orgId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // ===== Organization Settings =====
  async getOrgSettings(orgId) {
    return this.request(`/api/org/${orgId}/settings`);
  }

  async updateOrgSettings(orgId, settings) {
    return this.request(`/api/org/${orgId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ===== Reports & Analytics =====
  async generateReport(orgId, reportType, filters = {}) {
    return this.request('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ orgId, reportType, filters }),
    });
  }

  async getReports(orgId) {
    return this.request(`/api/reports?orgId=${orgId}`);
  }

  // ===== Health Check =====
  async health() {
    try {
      return await fetch(`${this.baseURL}/health`).then(r => r.json());
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

export const apiService = new APIService();

export default apiService;
