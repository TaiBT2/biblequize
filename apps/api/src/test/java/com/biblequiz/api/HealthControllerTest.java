package com.biblequiz.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HealthController.class)
class HealthControllerTest extends BaseControllerTest {

    @MockBean
    private DataSource dataSource;

    @Test
    void health_withDbUp_shouldReturnUp() throws Exception {
        Connection connection = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(connection);

        mockMvc.perform(get("/health/simple"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("UP"))
                .andExpect(jsonPath("$.timestamp").isNumber());
    }

    @Test
    void health_withDbDown_shouldReturnDbDown() throws Exception {
        when(dataSource.getConnection()).thenThrow(new RuntimeException("Connection refused"));

        mockMvc.perform(get("/health/simple"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("DOWN"))
                .andExpect(jsonPath("$.databaseError").value("Connection refused"));
    }
}
