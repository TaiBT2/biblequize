package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupQuizSetFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupQuizSetFolderRepository extends JpaRepository<GroupQuizSetFolder, String> {

    List<GroupQuizSetFolder> findByGroupIdOrderByDisplayOrder(String groupId);
}
