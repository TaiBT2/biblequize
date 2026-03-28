package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.ChurchGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChurchGroupRepository extends JpaRepository<ChurchGroup, String> {

    Optional<ChurchGroup> findByGroupCode(String code);

    List<ChurchGroup> findByLeaderId(String userId);
}
