<?php

namespace Pouce\TeamBundle\Entity;

use Gedmo\Mapping\Annotation as Gedmo;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Team
 *
 * @ORM\Table()
 * @ORM\Entity(repositoryClass="Pouce\TeamBundle\Entity\TeamRepository")
 */
class Team
{
    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToMany(targetEntity="Pouce\UserBundle\Entity\User", cascade={"persist"})
    */
    private $users;

    /**
     * @var string
     * @Assert\NotBlank()
     * @Assert\NotNull()
     *
     * @ORM\Column(name="teamName", type="string", length=255)
     */
    private $teamName;

    /**
     * @var string
     * @Assert\NotBlank()
     *
     * @ORM\Column(name="targetDestination", type="string", length=255)
     */
    private $targetDestination;

    /**
     * @var string
     * @Assert\NotBlank()
     *
     * @ORM\Column(name="comment", type="text")
     */
    private $comment;

    /**
     * @var boolean
     * 
     * @ORM\Column(name="finishRegister", type="boolean")
     */
    private $finishRegister;


    /**
     * @var datetime $created
     *
     * @Gedmo\Timestampable(on="create")
     * @ORM\Column(type="datetime")
     */
    private $created;

    /**
     * @var \DateTime $updated
     *
     * @Gedmo\Timestampable(on="update")
     * @ORM\Column(type="datetime")
     */
    private $updated;


    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set teamName
     *
     * @param string $teamName
     * @return Team
     */
    public function setTeamName($teamName)
    {
        $this->teamName = $teamName;

        return $this;
    }

    /**
     * Get teamName
     *
     * @return string 
     */
    public function getTeamName()
    {
        return $this->teamName;
    }

    /**
     * Set targetDestination
     *
     * @param string $targetDestination
     * @return Team
     */
    public function setTargetDestination($targetDestination)
    {
        $this->targetDestination = $targetDestination;

        return $this;
    }

    /**
     * Get targetDestination
     *
     * @return string 
     */
    public function getTargetDestination()
    {
        return $this->targetDestination;
    }

    /**
     * Set comment
     *
     * @param string $comment
     * @return Team
     */
    public function setComment($comment)
    {
        $this->comment = $comment;

        return $this;
    }

    /**
     * Get comment
     *
     * @return string 
     */
    public function getComment()
    {
        return $this->comment;
    }
}
