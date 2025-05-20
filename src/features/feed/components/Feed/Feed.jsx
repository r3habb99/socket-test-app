import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../../../../features/socket/components/SocketProviderCompat";
import { useAuthContext } from "../../../../core/providers/AuthProvider";
import { getPosts } from "../../api/postApi";
import { CreatePost } from "../CreatePost";
import { PostList } from "../PostList";
import { toast } from "react-toastify";
import "./Feed.css";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const { connected, subscribe } = useSocketContext();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const observerRef = useRef(null);

  // Use refs instead of state for pagination to avoid re-renders
  const pageRef = useRef(1);
  const lastPostIdRef = useRef(null);

  // Define fetchPosts first, then loadMorePosts will reference it
  const fetchPosts = useCallback(async (resetPosts = true) => {
    if (!isAuthenticated()) {
      console.warn("User not authenticated, redirecting to login");
      navigate("/login");
      return;
    }

    if (resetPosts) {
      setLoading(true);
      setError(null);
      pageRef.current = 1;
      lastPostIdRef.current = null;
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Prepare pagination options
      const options = {};
      if (!resetPosts) {
        options.page = pageRef.current;
        if (lastPostIdRef.current) options.lastPostId = lastPostIdRef.current;
      }

      const response = await getPosts(options);

      if (response.error) {
        console.error("Error in posts response:", response.message);
        setError(response.message || "Failed to load posts");
        if (resetPosts) setPosts([]);

        // If it's an authentication error, redirect to login
        if (response.status === 401) {
          console.warn("Authentication error, redirecting to login");
          navigate("/login?reason=session_expired");
        }
        return;
      }

      // Handle the new response structure
      const responseData = response.data;

      if (responseData && responseData.posts && Array.isArray(responseData.posts)) {
        // We have posts in the expected format
        const newPosts = responseData.posts;

        // Update pagination state
        const pagination = responseData.pagination || { has_more: false };
        setHasMore(pagination.has_more);

        // Update posts state
        if (resetPosts) {
          setPosts(newPosts);
        } else {
          setPosts(prevPosts => [...prevPosts, ...newPosts]);
        }

        // Update pagination tracking
        if (newPosts.length > 0) {
          const lastPost = newPosts[newPosts.length - 1];
          lastPostIdRef.current = lastPost._id;
          pageRef.current = pageRef.current + 1;
        }
      } else {
        console.error("Unexpected response structure:", response);
        if (resetPosts) {
          setPosts([]);
          setError("Failed to load posts. Please try again.");
        } else {
          toast.error("Failed to load more posts. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.warn("Authentication error, redirecting to login");
        navigate("/login?reason=session_expired");
      }

      if (resetPosts) {
        setError("Failed to load posts. Please try again.");
      } else {
        toast.error("Failed to load more posts. Please try again.");
      }
    } finally {
      if (resetPosts) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [
    isAuthenticated,
    navigate,
    setLoading,
    setError,
    setHasMore,
    setLoadingMore,
    setPosts
  ]);

  // Function to load more posts when scrolling
  const loadMorePosts = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPosts(false);
  }, [loading, loadingMore, hasMore, fetchPosts]);

  // Set up the intersection observer for infinite scrolling
  const loadMoreTriggerRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMorePosts]);

  // Only run once on mount
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up real-time updates for posts
  useEffect(() => {
    if (!connected) return;

    // Handle new posts
    const unsubscribeNewPost = subscribe("new post", (newPost) => {
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    });

    // Helper function to get post ID (handles both id and _id)
    const getPostId = (post) => post?.id || post?._id;

    // Handle post likes
    const unsubscribePostLiked = subscribe("post liked", (updatedPost) => {
      const updatedId = getPostId(updatedPost);
      if (!updatedId) return;

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          getPostId(post) === updatedId ? updatedPost : post
        )
      );
    });

    // Handle post retweets
    const unsubscribePostRetweeted = subscribe(
      "post retweeted",
      (updatedPost) => {
        const updatedId = getPostId(updatedPost);
        if (!updatedId) return;

        setPosts((prevPosts) => {
          // Remove the post if it already exists
          const filteredPosts = prevPosts.filter(
            (post) => getPostId(post) !== updatedId
          );
          // Add the updated post at the top
          return [updatedPost, ...filteredPosts];
        });
      }
    );

    // Handle post deletions
    const unsubscribePostDeleted = subscribe(
      "post deleted",
      (deletedPostId) => {
        if (!deletedPostId) return;

        setPosts((prevPosts) =>
          prevPosts.filter((post) => {
            const postId = getPostId(post);
            return postId !== deletedPostId;
          })
        );
      }
    );

    // Clean up subscriptions
    return () => {
      unsubscribeNewPost();
      unsubscribePostLiked();
      unsubscribePostRetweeted();
      unsubscribePostDeleted();
    };
  }, [connected, subscribe]);

  return (
    <div className="feed-container">
      <CreatePost onPostCreated={() => fetchPosts(true)} />
      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : error ? (
        <div className="error-message">
          {error}
          <button onClick={() => fetchPosts(true)} className="retry-button">
            Retry
          </button>
        </div>
      ) : (
        <>
          <PostList posts={posts} setPosts={setPosts} onPostsUpdated={() => fetchPosts(true)} />

          {/* Load more trigger element */}
          {posts.length > 0 && (
            <div ref={loadMoreTriggerRef} className="load-more-trigger">
              {loadingMore && (
                <div className="loading-more">Loading more posts...</div>
              )}
              {!hasMore && posts.length > 0 && (
                <div className="no-more-posts">No more posts to load</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Feed;
