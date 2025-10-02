package com.biblequiz.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/simple")
public class SimpleTestController {

    @GetMapping("/test")
    public String test() {
        return "Simple test endpoint works!";
    }
}
