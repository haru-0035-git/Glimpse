package cc.haruverse.backend;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;

@RestController
@CrossOrigin(origins = "http://localhost:3001") // フロントエンドのURLを指定
public class ApiController {

    @GetMapping("/api/hello")
    public Map<String, String> hello() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "こんにちは、Spring Bootからのメッセージです！");
        return response;
    }
}