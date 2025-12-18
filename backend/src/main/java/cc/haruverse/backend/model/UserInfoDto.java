package cc.haruverse.backend.model;

import cc.haruverse.backend.entity.User;

public class UserInfoDto {
    private Long id;
    private String username;
    private boolean admin;

    public UserInfoDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.admin = user.isAdmin();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public boolean isAdmin() {
        return admin;
    }
}
