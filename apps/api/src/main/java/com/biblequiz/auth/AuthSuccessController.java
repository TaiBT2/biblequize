package com.biblequiz.auth;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthSuccessController {

    @GetMapping("/auth/success")
    public String success(@RequestParam String token, 
                         @RequestParam String refreshToken,
                         @RequestParam String name,
                         @RequestParam String email,
                         Model model) {
        
        try {
            System.out.println("[AUTH_SUCCESS] Controller called with: " + name + " - " + email);
            
            model.addAttribute("token", token);
            model.addAttribute("refreshToken", refreshToken);
            model.addAttribute("name", name);
            model.addAttribute("email", email);
            
            System.out.println("[AUTH_SUCCESS] Model attributes set, returning template name");
            return "auth-success";
        } catch (Exception e) {
            System.err.println("[AUTH_SUCCESS] Error in controller: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
