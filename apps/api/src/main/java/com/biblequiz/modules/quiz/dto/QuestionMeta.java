package com.biblequiz.modules.quiz.dto;

import com.biblequiz.modules.quiz.entity.Question;

public record QuestionMeta(String id, String book, Question.Difficulty difficulty) {}
