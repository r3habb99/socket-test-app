import { DEFAULT_PROFILE_PIC } from "../../../../../constants";

/**
 * Helper function to ensure profile picture URL is in the correct format
 * @param {string} url - The profile picture URL to process
 * @returns {string} The processed profile picture URL
 */
export const getProcessedProfilePicUrl = (url) => {
  if (!url) return DEFAULT_PROFILE_PIC;

  // If it's already a full URL, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it includes /uploads/ but doesn't start with it, extract the /uploads/ part
  if (url.includes('/uploads/') && !url.startsWith('/uploads/')) {
    const uploadsMatch = url.match(/\/uploads\/.*$/);
    if (uploadsMatch) {
      return uploadsMatch[0];
    }
  }

  // If it's a relative path, make sure it starts with a slash
  if (!url.startsWith('/') && !url.startsWith('http')) {
    return '/' + url;
  }

  return url;
};

/**
 * Sort comments based on the selected sort order
 * @param {Array} comments - Array of comment objects to sort
 * @param {string} sortOrder - Sort order ('newest', 'oldest', 'most_liked')
 * @returns {Array} Sorted array of comment objects
 */
export const sortComments = (comments, sortOrder) => {
  return [...comments].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortOrder === "most_liked") {
      return (b.likes?.length || 0) - (a.likes?.length || 0);
    }
    return 0;
  });
};

/**
 * Extract comment ID from a comment object (handles both id and _id)
 * @param {Object} comment - Comment object
 * @returns {string} Comment ID
 */
export const getCommentId = (comment) => {
  return comment?._id || comment?.id;
};

/**
 * Check if two comment IDs are the same
 * @param {Object} comment1 - First comment object
 * @param {Object} comment2 - Second comment object
 * @returns {boolean} Whether the comment IDs are the same
 */
export const isSameComment = (comment1, comment2) => {
  return getCommentId(comment1) === getCommentId(comment2);
};

/**
 * Process comments data from API response
 * @param {Object} response - API response object
 * @returns {Array} Array of comment objects
 */
export const processCommentsResponse = (response) => {
  if (!response || response.error) {
    console.log('Invalid or error response:', response);
    return [];
  }

  // Log the full response structure for debugging
  console.log('Processing comments response:', JSON.stringify(response, null, 2));

  // Handle nested data structure if present
  let commentsData = [];

  try {
    // Check for different possible response structures
    if (response.data?.data?.comments) {
      // Structure: { data: { data: { comments: [...] } } }
      commentsData = response.data.data.comments;
      console.log('Found comments in response.data.data.comments');
    } else if (response.data?.comments) {
      // Structure: { data: { comments: [...] } }
      commentsData = response.data.comments;
      console.log('Found comments in response.data.comments');
    } else if (Array.isArray(response.data?.data)) {
      // Structure: { data: { data: [...] } }
      commentsData = response.data.data;
      console.log('Found comments in response.data.data (array)');
    } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      // Structure: { data: { data: { data: [...] } } }
      commentsData = response.data.data.data;
      console.log('Found comments in response.data.data.data');
    } else if (Array.isArray(response.data)) {
      // Structure: { data: [...] } (direct array)
      commentsData = response.data;
      console.log('Found comments in response.data (array)');
    } else if (response.data?.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      // Structure: { data: { data: { ... } } } (single comment object)
      commentsData = [response.data.data];
      console.log('Found single comment object in response.data.data');
    } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      // Structure: { data: { ... } } (single comment object)
      commentsData = [response.data];
      console.log('Found single comment object in response.data');
    } else {
      // Default empty array if no recognized structure
      console.warn('No recognized comment data structure in response:', response);
      commentsData = [];
    }

    // Ensure commentsData is an array
    if (!Array.isArray(commentsData)) {
      console.warn('Processed comments data is not an array, converting to array:', commentsData);
      commentsData = commentsData ? [commentsData] : [];
    }

    // Log the extracted comments data
    console.log(`Extracted ${commentsData.length} comments from response`);
  } catch (error) {
    console.error('Error processing comments response:', error);
    commentsData = [];
  }

  return commentsData;
};

/**
 * Process post data from API response
 * @param {Object} response - API response object
 * @returns {Object|null} Post object or null if not found
 */
export const processPostResponse = (response) => {
  if (!response || response.error) {
    console.log('Invalid or error response for post:', response);
    return null;
  }

  // Log the full response structure for debugging
  console.log('Processing post response:', JSON.stringify(response, null, 2));

  // Handle nested data structure if present
  let postData = null;

  try {
    // Check for different possible response structures
    if (response.data?.data?.data) {
      // Structure: { data: { data: { data: {...} } } }
      postData = response.data.data.data;
      console.log('Found post in response.data.data.data');
    } else if (response.data?.data) {
      // Structure: { data: { data: {...} } }
      postData = response.data.data;
      console.log('Found post in response.data.data');
    } else if (response.data?.post) {
      // Structure: { data: { post: {...} } }
      postData = response.data.post;
      console.log('Found post in response.data.post');
    } else if (response.data) {
      // Structure: { data: {...} } (direct object)
      postData = response.data;
      console.log('Found post in response.data');
    } else {
      // Structure: {...} (direct object)
      postData = response;
      console.log('Using direct response as post data');
    }

    // Ensure postData is an object
    if (!postData || typeof postData !== 'object') {
      console.warn('Processed post data is not an object:', postData);
      return null;
    }

    // Ensure postedBy exists
    if (!postData.postedBy && postData.author) {
      postData.postedBy = postData.author;
      console.log('Using author field as postedBy');
    }

    // Log the extracted post data
    console.log('Extracted post data:', postData);
  } catch (error) {
    console.error('Error processing post response:', error);
    return null;
  }

  return postData;
};

/**
 * Create socket event handlers for comments
 * @param {string} postId - Post ID
 * @param {Function} setComments - Function to update comments state
 * @param {Function} sortCommentsFunc - Function to sort comments
 * @param {string} sortOrder - Sort order
 * @returns {Object} Object containing socket event handlers
 */
export const createCommentSocketHandlers = (postId, setComments, sortCommentsFunc, sortOrder) => {
  // Handler for new comment events
  const handleNewComment = (data) => {
    if (data.postId === postId) {
      // Add the new comment to the list
      setComments((prevComments) => {
        // Check if comment already exists to avoid duplicates
        const exists = prevComments.some(
          (comment) => getCommentId(comment) === getCommentId(data)
        );
        if (exists) return prevComments;

        // Add new comment and sort based on current sort order
        const updatedComments = [...prevComments, data];
        return sortCommentsFunc(updatedComments, sortOrder);
      });
    }
  };

  // Handler for comment liked events
  const handleCommentLiked = (data) => {
    if (data.postId === postId) {
      // Update the liked comment in the list
      setComments((prevComments) =>
        prevComments.map((comment) =>
          getCommentId(comment) === getCommentId(data) ? data : comment
        )
      );
    }
  };

  // Handler for comment deleted events
  const handleCommentDeleted = (data) => {
    if (data.postId === postId) {
      // Remove the deleted comment from the list
      setComments((prevComments) =>
        prevComments.filter((comment) =>
          getCommentId(comment) !== getCommentId(data)
        )
      );
    }
  };

  return {
    handleNewComment,
    handleCommentLiked,
    handleCommentDeleted
  };
};

/**
 * Update post comment count when a new comment is added
 * @param {Object} post - Post object
 * @param {Function} setPost - Function to update post state
 * @returns {Function} Function to handle comment added
 */
export const createCommentAddedHandler = (post, setPost, sortCommentsFunc, sortOrder) => {
  return (newComment) => {
    // Update the post's comment count
    if (post) {
      setPost(prevPost => ({
        ...prevPost,
        commentCount: (prevPost.commentCount || 0) + 1,
        commentsCount: (prevPost.commentsCount || 0) + 1
      }));
    }

    // Return a function to update comments
    return (prevComments) => {
      const updatedComments = [...prevComments, newComment];
      return sortCommentsFunc(updatedComments, sortOrder);
    };
  };
};

/**
 * Group comments by parent ID for nested comments
 * @param {Array} comments - Array of comment objects
 * @returns {Object} Object with parent comment IDs as keys and arrays of child comments as values
 */
export const groupCommentsByParent = (comments) => {
  return comments.reduce((acc, comment) => {
    if (comment.replyToId) {
      if (!acc[comment.replyToId]) {
        acc[comment.replyToId] = [];
      }
      acc[comment.replyToId].push(comment);
    }
    return acc;
  }, {});
};

/**
 * Filter top-level comments (those without a parent)
 * @param {Array} comments - Array of comment objects
 * @param {boolean} isNested - Whether this is a nested comment list
 * @returns {Array} Filtered array of comment objects
 */
export const filterTopLevelComments = (comments, isNested = false) => {
  return !isNested
    ? comments.filter(comment => !comment.replyToId)
    : comments;
};
