# @dbz-code/providers

> Provider System — model provider adapters for DBZ Code.

Part of the [DBZ Code](../../README.md) monorepo.
Spec: [`docs/architecture/05-provider-system.md`](../../docs/architecture/05-provider-system.md)
Founder: Adam Belafia Es Safi

---

## Overview

The Provider System connects DBZ Code to language models.
All providers implement `ProviderInterface` from `@dbz-code/shared` —
the Runtime never knows how a provider works internally.

**Local-first:** Ollama is a first-class citizen. A fully local setup requires zero cloud services.

---

## Installation

```bash
pnpm add @dbz-code/providers
```

---

## Usage

### Ollama (local)

```ts
import { OllamaProvider, DefaultProviderRegistry } from "@dbz-code/providers";
import { EventBus } from "@dbz-code/events";

const bus = new EventBus();
const registry = new DefaultProviderRegistry({ bus });

const provider = new OllamaProvider({
  providerId: "ollama",
  modelId: "llama3",
  endpoint: "http://localhost:11434", // default
  timeoutMs: 120_000,                 // default
});

registry.register(provider);

// Pass directly to DBZRuntime
const runtime = new DBZRuntime({ bus, provider, toolRegistry });
```

---

## Providers

| Provider | Type | Status |
|----------|------|--------|
| `OllamaProvider` | `LocalAPI` | ✅ v1 |
| `OpenAIProvider` | `RemoteAPI` | ⏳ Pending spec |
| `AnthropicProvider` | `RemoteAPI` | ⏳ Pending spec |
| `GeminiProvider` | `RemoteAPI` | ⏳ Pending spec |
| `OpenRouterProvider` | `ProxyGateway` | ⏳ Pending spec |
| `LMStudioProvider` | `LocalAPI` | ⏳ Pending spec |

---

## Provider Registry

```ts
const registry = new DefaultProviderRegistry({ bus });

registry.register(provider);        // emits provider.registered
registry.unregister("ollama");      // emits provider.unregistered
registry.get("ollama");             // ProviderInterface | undefined
registry.list();                    // ProviderInterface[]
```

---

## Provider Events

| Event | When |
|-------|------|
| `provider.registered` | Provider added to registry |
| `provider.unregistered` | Provider removed from registry |
| `provider.connected` | Provider successfully contacted |
| `provider.disconnected` | Provider connection lost |
| `provider.failed` | Provider error |

---

## Error Hierarchy

```
ProviderError
├── ProviderConnectionError    — cannot reach server
├── ProviderAuthenticationError — invalid credentials
├── ProviderTimeoutError        — request exceeded timeoutMs
├── ProviderRateLimitError      — rate limited (carries retryAfterMs?)
└── ProviderModelNotFoundError  — model not available
```

---

## Extending

Implement a new provider by extending `BaseProvider`:

```ts
import { BaseProvider } from "@dbz-code/providers";
import { ProviderType } from "@dbz-code/shared";

class MyProvider extends BaseProvider {
  readonly id = "my-provider";

  async generate(request: GenerateRequest): Promise<GenerateResponse> { ... }
  getMetadata(): ProviderMetadata { ... }
  getCapabilities(): ProviderCapabilities { ... }
  async listModels(): Promise<ModelMetadata[]> { ... }
}
```

---

## License

MIT
