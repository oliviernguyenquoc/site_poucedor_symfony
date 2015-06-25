<?php

namespace Pouce\TeamBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Anecdote
 *
 * @ORM\Table(name="anecdote")
 * @ORM\Entity(repositoryClass="Pouce\TeamBundle\Entity\AnecdoteRepository")
 */
class Anecdote
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
     * @ORM\ManyToOne(targetEntity="Pouce\TeamBundle\Entity\Team")
     * @ORM\JoinColumn(nullable=false)
    */
    private $team;

    /**
     * @var string
     * @Assert\NotBlank()
     * @Assert\NotNull()
     * @Assert\Length(min="3")
     *
     * @ORM\Column(name="name", type="string", length=500)
     */
    private $name;


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
     * Set name
     *
     * @param string $name
     * @return Anecdote
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @return string 
     */
    public function getName()
    {
        return $this->name;
    }
}
