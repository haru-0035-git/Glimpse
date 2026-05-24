package cc.haruverse.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserCreateRequest {

    @NotBlank(message = "ユーザー名を入力してください。")
    @Size(min = 3, max = 50, message = "ユーザー名は3文字以上50文字以下で入力してください。")
    private String username;

    @NotBlank(message = "パスワードを入力してください。")
    @Size(min = 12, max = 100, message = "パスワードは12文字以上100文字以下で入力してください。")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
