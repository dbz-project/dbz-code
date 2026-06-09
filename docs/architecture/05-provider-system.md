# DBZ Code Architecture

## 05 - Provider System

Version: 1.0

Status: Accepted

Founder: Adam Belafia Es Safi

---

# Purpose

The Provider System is responsible for connecting DBZ Code to language models.

Providers abstract:

- Remote APIs
- Local APIs
- Local model runtimes
- Future inference backends

The Runtime must never know how a provider works internally.

The Runtime only communicates through ProviderInterface.

---

# Goals

## Primary Goals

- Provider agnostic
- Model agnostic
- Local-first compatible
- Multi-provider support
- Capability discovery
- Hot-swappable providers

## Non Goals

- Tool execution
- Session management
- Memory management
- Skill execution
- Runtime orchestration

---

# Package

packages/providers

---

# Directory Structure

packages/providers/

src/

base/
registry/
providers/
types/

index.ts

---

# Provider Types

Supported categories:

```text
Remote API
Local API
Embedded Runtime
Proxy Gateway

Examples:

OpenAI
Anthropic
Gemini
OpenRouter

Ollama
LM Studio
vLLM

llama.cpp

Future Providers
Provider Metadata

Every provider must expose:

interface ProviderMetadata {
  id: string;

  name: string;

  version: string;

  providerType: ProviderType;
}
ProviderType
export enum ProviderType {
  RemoteAPI,
  LocalAPI,
  EmbeddedRuntime,
  ProxyGateway
}
Model Metadata

Every model must expose:

interface ModelMetadata {
  id: string;

  name: string;

  contextWindow: number;

  maxOutputTokens: number;

  supportsTools: boolean;

  supportsImages: boolean;

  supportsStreaming: boolean;

  supportsSystemMessages: boolean;
}
Provider Capabilities
interface ProviderCapabilities {
  chat: boolean;

  tools: boolean;

  images: boolean;

  streaming: boolean;

  embeddings: boolean;
}
Provider Interface

Extends the shared contract.

interface ProviderInterface {
  id: string;

  generate(
    request: GenerateRequest
  ): Promise<GenerateResponse>;
}

Provider implementations may add methods internally but Runtime must only use generate().

Provider Registry

Purpose:

Central provider discovery.

Interface:

interface ProviderRegistry {
  register(
    provider: ProviderInterface
  ): void;

  unregister(
    providerId: string
  ): void;

  get(
    providerId: string
  ): ProviderInterface | undefined;

  list(): ProviderInterface[];
}
Provider Configuration
interface ProviderConfig {
  providerId: string;

  apiKey?: string;

  endpoint?: string;

  timeoutMs?: number;
}
OpenAI Provider

Package:

providers/openai

Requirements:

Chat Completions
Responses API (future)
Tool Calling
System Messages
Anthropic Provider

Package:

providers/anthropic

Requirements:

Messages API
Tool Use
System Prompts
Gemini Provider

Package:

providers/gemini

Requirements:

Generate Content API
Tool Support
Ollama Provider

Package:

providers/ollama

Requirements:

Local inference
Local models
Tool support
Zero cloud dependency

This provider is a first-class citizen.

LM Studio Provider

Package:

providers/lmstudio

Requirements:

OpenAI compatible endpoint support
OpenRouter Provider

Package:

providers/openrouter

Requirements:

OpenRouter API
Model routing
Provider Selection

Runtime v1 uses:

One Runtime
One Provider

Provider switching requires creating a new Runtime instance.

Error Types
ProviderConnectionError

ProviderAuthenticationError

ProviderTimeoutError

ProviderRateLimitError

ProviderModelNotFoundError

All provider errors must be typed.

Events

Provider System emits:

provider.registered

provider.unregistered

provider.connected

provider.disconnected

provider.failed
Local First Principle

DBZ Code must support fully local operation.

The following setup must work:

Runtime
↓
Ollama
↓
Local Model

without any cloud service.

Future Compatibility

The Provider System must support:

Quantized models
GGUF models
vLLM clusters
Distributed inference
Future provider types

without changing Runtime.

Acceptance Criteria

Implementation is complete when:

Provider Registry exists
Provider Metadata exists
Model Metadata exists
Capabilities exist
Error hierarchy exists
Ollama Provider works
Mock Provider tests pass
Runtime can use providers without modification
Decision Summary

Approved:

Provider Registry
Provider Metadata
Model Metadata
Capability Discovery
Local First Support
Ollama First-Class Support
Multi Provider Architecture

Frozen for Provider System v1.