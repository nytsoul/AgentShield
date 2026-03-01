"""
Base types shared across all classifier layers.

Provides:
- ClassifierResult: standard return type for every classifier
- FailSecureError: raised when a classifier cannot safely determine outcome
"""


class ClassifierResult:
    """Standard result returned by every classifier layer."""

    __slots__ = ("passed", "threat_score", "owasp_tag", "metadata", "reason")

    def __init__(
        self,
        passed: bool,
        threat_score: float,
        owasp_tag: str,
        metadata: dict = None,
        reason: str = "",
    ):
        self.passed = passed
        self.threat_score = threat_score
        self.owasp_tag = owasp_tag
        self.metadata = metadata if metadata is not None else {}
        self.reason = reason

    def __repr__(self):
        return (
            f"ClassifierResult(passed={self.passed}, "
            f"threat_score={self.threat_score:.3f}, "
            f"owasp_tag='{self.owasp_tag}', "
            f"reason='{self.reason[:60]}')"
        )


class FailSecureError(Exception):
    """Raised when a classifier cannot safely determine the result.

    The caller should treat this as a *block* – fail closed.
    """
    pass
