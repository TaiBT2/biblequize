package com.biblequiz.modules.adminai.provider;

/** Thrown when a provider fails to generate. The router catches and tries the next provider. */
public class AIProviderException extends RuntimeException {
    public AIProviderException(String message) { super(message); }
    public AIProviderException(String message, Throwable cause) { super(message, cause); }
}
