import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../../../../core/providers/SocketProvider";
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
  const [page, setPage] = useState(1);
  const [lastPostId, setLastPostId] = useState(null);
  const { connected, subscribe } = useSocketContext();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const observerRef = useRef(null);

  // Define fetchPosts first, then loadMorePosts will reference it
  const fetchPosts = async (resetPosts = true) => {
    if (!isAuthenticated()) {
      console.warn("User not authenticated, redirecting to login");
      navigate("/login");
      return;
    }

    if (resetPosts) {
      setLoading(true);
      setError(null);
      setPage(1);
      setLastPostId(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Prepare pagination options
      const options = {};
      if (!resetPosts) {
        options.page = page;
        if (lastPostId) options.lastPostId = lastPostId;
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
          setLastPostId(lastPost._id);
          setPage(prevPage => prevPage + 1);
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
  };

  // Function to load more posts when scrolling
  const loadMorePosts = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchPosts(false);
  };

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
  }, [loading, loadingMore, hasMore]);

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

    // Handle post likes
    const unsubscribePostLiked = subscribe("post liked", (updatedPost) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        )
      );
    });

    // Handle post retweets
    const unsubscribePostRetweeted = subscribe(
      "post retweeted",
      (updatedPost) => {
        setPosts((prevPosts) => {
          // Remove the post if it already exists
          const filteredPosts = prevPosts.filter(
            (post) => post.id !== updatedPost.id
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
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== deletedPostId)
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
