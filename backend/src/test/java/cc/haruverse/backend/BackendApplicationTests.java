package cc.haruverse.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"jwt.secret=0123456789abcdef0123456789abcdef",
		"spring.datasource.url=jdbc:h2:mem:backend-tests;MODE=MySQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop"
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
