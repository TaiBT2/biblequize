package com.biblequiz.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;

/**
 * Resolves the request locale from the {@code Accept-Language} header so
 * server-generated messages (via MessageSource / messages*.properties) can be
 * returned in Vietnamese or English. The frontend sets this header from its
 * i18n language. Vietnamese is the product default / fallback.
 */
@Configuration
public class WebI18nConfig {

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(new Locale("vi"));
        resolver.setSupportedLocales(List.of(new Locale("vi"), Locale.ENGLISH));
        return resolver;
    }
}
