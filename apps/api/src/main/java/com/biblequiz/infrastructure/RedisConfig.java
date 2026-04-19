package com.biblequiz.infrastructure;


import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    /**
     * Build an ObjectMapper for Redis that preserves polymorphic type info on
     * serialize. Without {@code activateDefaultTyping}, Jackson writes nested
     * objects as plain JSON and deserializes list elements back as
     * {@link java.util.LinkedHashMap}, so {@code (List<Question>) value} casts
     * later blow up at first element access with a {@link ClassCastException}.
     *
     * <p>Keeps the app's ObjectMapper untouched (HTTP responses stay clean of
     * {@code @class} properties) and only adds the {@code @class} property to
     * Redis payloads. Constrained by {@link BasicPolymorphicTypeValidator} to
     * allow our own {@code com.biblequiz.*} types plus JDK collections — do
     * not broaden this; wide polymorphism on Redis is a known RCE vector.
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Use String serializer for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Dedicated Redis ObjectMapper built from scratch — avoids ObjectMapper.copy()
        // which in some Jackson/Spring combinations fails to carry over a later
        // activateDefaultTyping call, producing JSON without @class and then
        // breaking deserialize with "missing type id property '@class'".
        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("com.biblequiz.")
                .allowIfSubType("java.util.")
                .allowIfSubType("java.lang.")
                .allowIfSubType("java.time.")
                .build();
        ObjectMapper redisMapper = new ObjectMapper();
        redisMapper.registerModule(new JavaTimeModule());
        redisMapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(redisMapper);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
