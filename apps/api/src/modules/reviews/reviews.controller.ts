import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ReviewsService } from "./reviews.service.js";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  // Can `userId` review on this completed assignment (and have they already)?
  @Get("eligibility/:assignmentId")
  eligibility(@Param("assignmentId") assignmentId: string, @Query("userId") userId: string) {
    return this.reviews.eligibility(assignmentId, userId);
  }

  // Submit a review for a completed assignment.
  @Post()
  create(
    @Body()
    body: {
      assignmentId: string;
      authorUserId: string;
      rating: number;
      communication?: number | null;
      professionalism?: number | null;
      paymentSpeed?: number | null;
      quality?: number | null;
      comment?: string | null;
    },
  ) {
    return this.reviews.create(body);
  }

  // All visible reviews a user has received.
  @Get("user/:userId")
  forUser(@Param("userId") userId: string) {
    return this.reviews.listForUser(userId);
  }

  @Post(":id/helpful")
  helpful(@Param("id") id: string, @Body() body: { userId: string }) {
    return this.reviews.markHelpful(id, body.userId);
  }

  @Post(":id/report")
  report(@Param("id") id: string, @Body() body: { userId: string; reason?: string }) {
    return this.reviews.report(id, body.userId, body.reason);
  }
}
