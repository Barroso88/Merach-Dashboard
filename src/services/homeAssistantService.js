// Home Assistant Integration Service for Official Merach Bike Sensors (via ESP32 / ESPHome)

export class HomeAssistantService {
  constructor(config = {}) {
    this.url = (config.haUrl || 'http://homeassistant.local:8123').replace(/\/$/, '');
    this.token = config.haToken || '';
    this.entities = config.haEntities || {
      cadence: 'sensor.merach_bike_cadence',
      speed: 'sensor.merach_bike_speed'
    };
    this.isConnected = false;
    this.lastError = null;
  }

  updateConfig(config) {
    if (config.haUrl) this.url = config.haUrl.replace(/\/$/, '');
    if (config.haToken !== undefined) this.token = config.haToken;
    if (config.haEntities) this.entities = { ...this.entities, ...config.haEntities };
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async testConnection() {
    if (!this.token) {
      return { 
        success: false, 
        message: 'Token de Acesso de Longa Duração não configurado.' 
      };
    }

    try {
      const response = await fetch(`${this.url}/api/`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        this.isConnected = true;
        this.lastError = null;

        // Try reading current states of cadence and speed entities to give instant feedback
        let entityDetails = '';
        try {
          const telemetry = await this.fetchTelemetry();
          entityDetails = ` | Sensores lidos: Cadência: ${telemetry.cadence} RPM, Vel: ${telemetry.speed} km/h`;
        } catch {
          // It's ok if entities aren't found yet, the API connection itself is verified
        }

        return { 
          success: true, 
          message: `Conectado ao Home Assistant com sucesso!${entityDetails}` 
        };
      } else if (response.status === 401) {
        this.isConnected = false;
        return { 
          success: false, 
          message: 'Erro 401: Token de autorização inválido ou expirado.' 
        };
      } else {
        this.isConnected = false;
        return { 
          success: false, 
          message: `Erro HTTP ${response.status}: Falha ao contactar endpoint do Home Assistant.` 
        };
      }
    } catch (err) {
      this.isConnected = false;
      this.lastError = err.message;
      const isCorsOrNetwork = err.name === 'TypeError' || err.message?.includes('Failed to fetch');
      return { 
        success: false, 
        isCors: isCorsOrNetwork,
        message: isCorsOrNetwork 
          ? `Não foi possível alcançar ${this.url}. Verifique o IP/URL e se o CORS está ativo no Home Assistant.`
          : `Erro de ligação: ${err.message}` 
      };
    }
  }

  async discoverEntities() {
    if (!this.token) {
      throw new Error('Insira o Token de Acesso de Longa Duração antes de procurar sensores.');
    }

    try {
      const response = await fetch(`${this.url}/api/states`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao consultar entidades.`);
      }

      const states = await response.json();
      
      // Filter candidates for Merach / ESP32 cycling entities
      const candidates = states.filter((s) => {
        const id = s.entity_id.toLowerCase();
        const fn = (s.attributes?.friendly_name || '').toLowerCase();
        const unit = (s.attributes?.unit_of_measurement || '').toLowerCase();
        return (
          id.includes('cadence') || id.includes('speed') || id.includes('merach') || 
          id.includes('bike') || id.includes('cycling') || id.includes('rpm') ||
          unit === 'rpm' || unit === 'km/h' ||
          fn.includes('merach') || fn.includes('cadênc') || fn.includes('cadence') || fn.includes('veloc')
        );
      });

      // Best auto matches
      const bestCadence = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        const unit = (c.attributes?.unit_of_measurement || '').toLowerCase();
        return id.includes('cadence') || unit === 'rpm';
      });

      const bestSpeed = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        const unit = (c.attributes?.unit_of_measurement || '').toLowerCase();
        return id.includes('speed') || (unit.includes('km/h') && (id.includes('bike') || id.includes('merach')));
      });

      return {
        success: true,
        candidates: candidates.map(c => ({
          entity_id: c.entity_id,
          name: c.attributes?.friendly_name || c.entity_id,
          state: c.state,
          unit: c.attributes?.unit_of_measurement || ''
        })),
        suggestedCadence: bestCadence ? bestCadence.entity_id : null,
        suggestedSpeed: bestSpeed ? bestSpeed.entity_id : null
      };
    } catch (err) {
      const isCorsOrNetwork = err.name === 'TypeError' || err.message?.includes('Failed to fetch');
      throw new Error(
        isCorsOrNetwork 
          ? `Falha ao aceder à API (${this.url}). Confirme se o Home Assistant permite CORS para a origem do dashboard.`
          : err.message
      );
    }
  }

  async fetchTelemetry() {
    if (!this.token) {
      throw new Error('Home Assistant Token not configured');
    }

    try {
      const fetchEntity = async (entityId) => {
        if (!entityId) return null;
        try {
          const res = await fetch(`${this.url}/api/states/${entityId}`, {
            headers: this.getHeaders(),
            signal: AbortSignal.timeout(3000)
          });
          if (!res.ok) return null;
          const json = await res.json();
          const val = parseFloat(json.state);
          return isNaN(val) ? 0 : val;
        } catch {
          return null;
        }
      };

      const [cadence, speed] = await Promise.all([
        fetchEntity(this.entities.cadence),
        fetchEntity(this.entities.speed)
      ]);

      return {
        cadence: cadence ?? 0,
        speed: speed ?? 0
      };
    } catch (err) {
      console.warn('Failed to fetch telemetry from Home Assistant:', err);
      throw err;
    }
  }
}
