"use strict";

$(function () {
    $(".js-faq-toggle").on("click", function () {
        const button = $(this);
        const answer = button.closest(".faq-item").find(".faq-answer");
        const isExpanded = button.attr("aria-expanded") === "true";

        button.attr("aria-expanded", String(!isExpanded));
        answer.stop(true, true).slideToggle(180);
    });

    $(".js-help-toggle").on("click", function () {
        const button = $(this);
        const helpText = button.parent().children(".js-help-content");
        const isExpanded = button.attr("aria-expanded") === "true";

        button.attr("aria-expanded", String(!isExpanded));
        helpText.stop(true, true).fadeToggle(140);
    });

    $("#projectSearch").on("keydown", function (event) {
        if (event.key === "Escape") {
            $(this).val("").trigger("input");
        }
    });
});
