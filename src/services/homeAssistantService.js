// Home Assistant Integration Service for Official Merach Bike Sensors (via ESP32 / ESPHome)

export class HomeAssistantService {
  constructor(config = {}) {
    this.url = (config.haUrl || 'https://ha.barrosoportal.com').replace(/\/$/, '');
    this.token = config.haToken || '';
    this.cfClientId = config.cfClientId || '';
    this.cfClientSecret = config.cfClientSecret || '';
    this.entities = config.haEntities || {
      cadence: 'sensor.merach_bike_cadence',
      speed: 'sensor.merach_bike_speed',
      power: '',
      resistance: '',
      heartRate: '',
      distance: '',
      calories: ''
    };
    this.isConnected = false;
    this.lastError = null;
  }

  updateConfig(config) {
    if (config.haUrl) this.url = config.haUrl.replace(/\/$/, '');
    if (config.haToken !== undefined) this.token = config.haToken;
    if (config.cfClientId !== undefined) this.cfClientId = config.cfClientId;
    if (config.cfClientSecret !== undefined) this.cfClientSecret = config.cfClientSecret;
    if (config.haEntities) this.entities = { ...this.entities, ...config.haEntities };
  }

  getHeaders() {
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
    if (this.cfClientId && this.cfClientSecret) {
      headers['CF-Access-Client-Id'] = this.cfClientId.trim();
      headers['CF-Access-Client-Secret'] = this.cfClientSecret.trim();
    }
    return headers;
  }

  // Smart request helper: tries direct fetch first, and automatically falls back to /ha-proxy on CORS errors
  async request(path, method = 'GET') {
    const directUrl = `${this.url}${path}`;
    const headers = this.getHeaders();

    try {
      const res = await fetch(directUrl, {
        method,
        headers,
        signal: AbortSignal.timeout(4000)
      });
      return res;
    } catch (directErr) {
      const isCorsOrNetwork = directErr.name === 'TypeError' || directErr.message?.includes('Failed to fetch');
      if (isCorsOrNetwork) {
        try {
          const proxyUrl = `/ha-proxy?target=${encodeURIComponent(directUrl)}`;
          const proxyRes = await fetch(proxyUrl, {
            method,
            headers,
            signal: AbortSignal.timeout(8000)
          });
          return proxyRes;
        } catch {
          throw directErr;
        }
      }
      throw directErr;
    }
  }

  async testConnection() {
    if (!this.token) {
      return { 
        success: false, 
        message: 'Token de Acesso de Longa Duração não configurado.' 
      };
    }

    try {
      const response = await this.request('/api/');

      if (response.ok) {
        this.isConnected = true;
        this.lastError = null;

        // Try reading current states of mapped entities to give instant feedback
        let entityDetails = '';
        try {
          const telemetry = await this.fetchTelemetry();
          const parts = [];
          if (this.entities.cadence) parts.push(`Cadência: ${telemetry.cadence} RPM`);
          if (this.entities.speed) parts.push(`Vel: ${telemetry.speed} km/h`);
          if (this.entities.power) parts.push(`Potência: ${telemetry.power} W`);
          if (this.entities.resistance) parts.push(`Resistência: ${telemetry.resistance}`);
          if (this.entities.heartRate) parts.push(`Pulso: ${telemetry.heartRate} BPM`);
          if (parts.length > 0) {
            entityDetails = ` | Sensores ativos: ${parts.join(', ')}`;
          }
        } catch {
          // If entities aren't found yet, the API connection itself is verified
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
      } else if (response.status === 403) {
        const text = await response.text();
        this.isConnected = false;
        if (text.includes('not allowed by policy') || text.includes('Cloudflare')) {
          return {
            success: false,
            isCloudflarePolicy: true,
            message: 'Erro 403: Bloqueado pela política do Cloudflare Access (Zero Trust). Requer regra de Bypass para /api/* ou Service Token.'
          };
        }
        return {
          success: false,
          message: 'Erro 403: Acesso negado pelo Home Assistant.'
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
          ? `Não foi possível alcançar ${this.url}. Verifique se o endereço está acessível no seu browser ou rede local.`
          : `Erro de ligação: ${err.message}` 
      };
    }
  }

  async discoverEntities() {
    if (!this.token) {
      throw new Error('Insira o Token de Acesso de Longa Duração antes de procurar sensores.');
    }

    try {
      const response = await this.request('/api/states');

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao consultar entidades.`);
      }

      const states = await response.json();
      
      // 1. Filter strictly for Merach / Bike specific entities (avoiding general home sensors like switches, fans, curtains)
      const merachCandidates = states.filter((s) => {
        const id = s.entity_id.toLowerCase();
        const fn = (s.attributes?.friendly_name || '').toLowerCase();
        return (
          id.includes('merach') || 
          fn.includes('merach') || 
          (id.includes('bike') && !id.includes('curtain') && !id.includes('switch') && !id.includes('plug'))
        );
      });

      // If Merach-specific entities exist (like in the user's setup), use ONLY those!
      // Otherwise, fallback to a strict cycling sensor filter
      let candidates = [];
      if (merachCandidates.length > 0) {
        candidates = merachCandidates;
      } else {
        candidates = states.filter((s) => {
          const id = s.entity_id.toLowerCase();
          const fn = (s.attributes?.friendly_name || '').toLowerCase();
          const unit = (s.attributes?.unit_of_measurement || '').toLowerCase();
          return (
            (id.includes('cadence') || unit === 'rpm' || fn.includes('cadênc')) ||
            (id.includes('speed') && (id.includes('bike') || id.includes('cycling') || fn.includes('bicicleta'))) ||
            (id.includes('resistance') && (id.includes('bike') || fn.includes('resistênc')))
          );
        });
      }

      // Best auto matches for each category
      const bestCadence = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        const unit = (c.attributes?.unit_of_measurement || '').toLowerCase();
        return id.includes('cadence') || unit === 'rpm';
      });

      const bestSpeed = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        const unit = (c.attributes?.unit_of_measurement || '').toLowerCase();
        return id.includes('speed') || unit.includes('km/h');
      });

      const bestPower = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        const fn = (c.attributes?.friendly_name || '').toLowerCase();
        const unit = (c.attributes?.unit_of_measurement || '').toLowerCase();
        return (
          id.includes('power') ||
          id.includes('potencia') ||
          id.includes('potência') ||
          id.includes('watt') ||
          fn.includes('power') ||
          fn.includes('potência') ||
          fn.includes('potencia') ||
          unit === 'w'
        );
      });

      const bestResistance = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        const fn = (c.attributes?.friendly_name || '').toLowerCase();
        return id.includes('resistance') || id.includes('resistencia') || fn.includes('resistênc');
      });

      const bestHeartRate = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        const unit = (c.attributes?.unit_of_measurement || '').toLowerCase();
        return (id.includes('heart') || id.includes('pulse') || unit === 'bpm') && (id.includes('merach') || id.includes('bike'));
      });

      const bestDistance = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        return (id.includes('distance') || id.includes('distancia')) && (id.includes('merach') || id.includes('bike'));
      });

      const bestCalories = candidates.find((c) => {
        const id = c.entity_id.toLowerCase();
        return (id.includes('calorie') || id.includes('caloria') || id.includes('kcal')) && (id.includes('merach') || id.includes('bike'));
      });

      return {
        success: true,
        candidates: candidates.map(c => ({
          entity_id: c.entity_id,
          name: c.attributes?.friendly_name || c.entity_id,
          state: c.state,
          unit: c.attributes?.unit_of_measurement || ''
        })),
        suggestions: {
          cadence: bestCadence ? bestCadence.entity_id : null,
          speed: bestSpeed ? bestSpeed.entity_id : null,
          power: bestPower ? bestPower.entity_id : null,
          resistance: bestResistance ? bestResistance.entity_id : null,
          heartRate: bestHeartRate ? bestHeartRate.entity_id : null,
          distance: bestDistance ? bestDistance.entity_id : null,
          calories: bestCalories ? bestCalories.entity_id : null
        }
      };
    } catch (err) {
      const isCorsOrNetwork = err.name === 'TypeError' || err.message?.includes('Failed to fetch');
      throw new Error(
        isCorsOrNetwork 
          ? `Falha ao aceder à API (${this.url}). Confirme se o Home Assistant está acessível.`
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
          const res = await this.request(`/api/states/${entityId}`);
          if (!res.ok) return null;
          const json = await res.json();
          const val = parseFloat(json.state);
          return isNaN(val) ? 0 : val;
        } catch {
          return null;
        }
      };

      const [cadence, speed, power, resistance, heartRate, distance, calories] = await Promise.all([
        fetchEntity(this.entities.cadence),
        fetchEntity(this.entities.speed),
        fetchEntity(this.entities.power),
        fetchEntity(this.entities.resistance),
        fetchEntity(this.entities.heartRate),
        fetchEntity(this.entities.distance),
        fetchEntity(this.entities.calories)
      ]);

      return {
        cadence: cadence ?? 0,
        speed: speed ?? 0,
        power: power ?? 0,
        resistance: resistance ?? 0,
        heartRate: heartRate ?? 0,
        distance: distance !== null && !isNaN(distance) ? distance : null,
        calories: calories !== null && !isNaN(calories) ? calories : null
      };
    } catch (err) {
      console.warn('Failed to fetch telemetry from Home Assistant:', err);
      throw err;
    }
  }
}
