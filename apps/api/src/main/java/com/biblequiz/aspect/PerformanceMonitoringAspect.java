package com.biblequiz.aspect;

import com.biblequiz.service.PerformanceMonitoringService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Aspect
@Component
public class PerformanceMonitoringAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitoringAspect.class);
    
    @Autowired
    private PerformanceMonitoringService performanceMonitoringService;
    
    @Around("execution(* com.biblequiz.service..*(..)) && !within(com.biblequiz.service.PerformanceMonitoringService)")
    public Object monitorServiceMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        return monitorMethod(joinPoint, "SERVICE");
    }
    
    @Around("execution(* com.biblequiz.repository..*(..))")
    public Object monitorRepositoryMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        return monitorMethod(joinPoint, "REPOSITORY");
    }
    
    @Around("execution(* com.biblequiz.controller..*(..))")
    public Object monitorControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        return monitorMethod(joinPoint, "CONTROLLER");
    }
    
    private Object monitorMethod(ProceedingJoinPoint joinPoint, String layer) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String methodName = signature.getDeclaringType().getSimpleName() + "." + signature.getName();
        String fullMethodName = layer + ":" + methodName;
        
        Instant start = Instant.now();
        
        try {
            Object result = joinPoint.proceed();
            Duration executionTime = Duration.between(start, Instant.now());
            
            performanceMonitoringService.recordMethodExecution(fullMethodName, executionTime);
            
            return result;
        } catch (Exception e) {
            Duration executionTime = Duration.between(start, Instant.now());
            performanceMonitoringService.recordMethodExecution(fullMethodName, executionTime, "ERROR: " + e.getMessage());
            throw e;
        }
    }
}
