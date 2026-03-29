package cc.haruverse.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.Cookie;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "jwt.secret=0123456789abcdef0123456789abcdef",
        "spring.datasource.url=jdbc:h2:mem:csrf-tests;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.admin.username=admin",
        "app.admin.password=ChangeMeNow2026!"
})
@AutoConfigureMockMvc
class SecurityCsrfIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void csrfEndpointIssuesTokenCookie() throws Exception {
        mockMvc.perform(get("/api/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    void authenticateWithoutCsrfTokenIsForbidden() throws Exception {
        mockMvc.perform(post("/api/authenticate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void authenticateWithCsrfCookieAndHeaderIsAllowed() throws Exception {
        String csrfToken = issueCsrfToken().getValue();

        mockMvc.perform(post("/api/authenticate")
                        .cookie(new Cookie("XSRF-TOKEN", csrfToken))
                        .header("X-XSRF-TOKEN", csrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"ChangeMeNow2026!\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("GLIMPSE_AUTH"));
    }

    @Test
    void logoutWithCsrfTokenIsAllowed() throws Exception {
        String csrfToken = issueCsrfToken().getValue();

        mockMvc.perform(post("/api/logout")
                        .cookie(new Cookie("XSRF-TOKEN", csrfToken))
                        .header("X-XSRF-TOKEN", csrfToken))
                .andExpect(status().isOk());
    }

    private Cookie issueCsrfToken() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andReturn();

        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        if (cookie == null) {
            throw new IllegalStateException("XSRF-TOKEN cookie was not issued.");
        }
        return cookie;
    }
}
